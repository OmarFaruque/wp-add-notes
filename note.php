<?php
class RESPONSIVESTICKYNOTES_note {

	const post_type = 'respstickynotes_note';
	const page_id = 'page_id';
	const element_chain = 'element_chain';
	const color = 'color';
	const bgcolor = 'bgcolor';
	const default_title = "";
	const default_tooltip = "Empty note";
	const slug = "responsive-sticky-notes";

	public static function register_post_type() {
		register_post_type( self::post_type, array(
				'labels' => array(
						'name' 			=> __( 'Sticky Notes', 'responsive-sticky-notes' ),
						'singular_name' => __( 'Sticky Note', 'responsive-sticky-notes' )),
				'rewrite' 			=> false,
				'query_var' 		=> false ) );
	}

	public static function delete_note($post_id) {
		wp_delete_post($post_id, true);
		delete_post_meta($post_id, self::color);
		delete_post_meta($post_id, self::bgcolor);
		delete_post_meta($post_id, self::page_id);
		delete_post_meta($post_id, self::element_chain);
	}

	public static function get_notes($post_ids=NULL, $get_contents = TRUE) {

		$out = array();
		global $post;
		$args=array(
				'post_type' 		=> self::post_type,
				'post_status' 		=> 'publish',
				'author__in'  		=>[get_current_user_id()],
				'posts_per_page' 	=> -1,
				'order'				=>'ASC'
		);

		if(!$get_contents && isset($_POST['search-custom-notes'])){
			$args['s']=$_POST['search-custom-notes'];
		}
		$my_query = new WP_Query($args);



		if( $my_query->have_posts() ) {
			$index = 1;
			while ($my_query->have_posts()) {
				$my_query->the_post();
				$elementChain = get_post_meta($post->ID, RESPONSIVESTICKYNOTES_note::element_chain, true);

				$found = true;
				if ($post_ids != NULL) {
					$found = false;
					//don't want to send all the notes, just the ones on the page which sent the request
					$re = '/article#post-(\d+)/i';
					if (preg_match($re, $elementChain, $matches)) {
						if (in_array($matches[1], $post_ids)) {
							$found = true;
						}
					}
					if ($found==false) {
						$re = '/page-id-(\d+)/i';
						if (preg_match($re, $elementChain, $matches)) {
							if (in_array($matches[1], $post_ids)) {
								$found = true;
							}
						}
					}
					if($found == false){
						$re = '/BODY.postid-(\d+)/i';
						if (preg_match($re, $elementChain, $matches)) {
							if (in_array($matches[1], $post_ids)) {
								$found = true;
							}
						}
					}
				}


				if ($found) {
					$pageId = get_post_meta($post->ID, RESPONSIVESTICKYNOTES_note::page_id, true);
					$color = get_post_meta($post->ID, RESPONSIVESTICKYNOTES_note::color, true);
					$bgcolor = get_post_meta($post->ID, RESPONSIVESTICKYNOTES_note::bgcolor, true);
					$pageLink = get_permalink($pageId);

					$v_name = $current_time = false;
					if( get_post_meta( $post->ID, 'v_name', true ) && get_post_meta( $post->ID, 'current_time', true ) ){
						$pageLink .= '?v=' .  get_post_meta( $post->ID, 'v_name', true ) . '&t=' . get_post_meta( $post->ID, 'current_time', true );
						$v_name = get_post_meta( $post->ID, 'v_name', true );
						$current_time = get_post_meta( $post->ID, 'current_time', true );
					}

					$pageName = get_the_title($pageId);
					$content = $post->post_content;
					$page="<a href=\"$pageLink\">$pageName</a>";
					$title = self::get_title($post);
					$tooltip = self::get_tooltip($post);
					$admin_url = (self::can_edit()) ? self::admin_url($post->ID) : null;
					

					array_push($out, array(
						'id'=>$post->ID,
						'index' => $index,
						'name'=>$title,
						'elementChain'=>$elementChain,
						'text'=>$content,
						'created'=>$post->post_date,
						'page'=>$page,
						'tooltip'=>$tooltip,
						'admin_url'=>$admin_url,
						'color'=>$color,
						'bg_color'=>$bgcolor, 
						'v_name' => $v_name, 
						'current_time' => $current_time, 
						'page_link' => $pageLink
					));
				}
				$index++;
			}
		}
		wp_reset_query();  // Restore global post data stomped by the_post().
		return $out;
	}

	public static function can_edit() {
		return true;
	}

	public static function admin_url($post_id) {
		if (!self::can_edit()) return null;
		return sprintf('%s?page=%s&action=%s&id=%s',admin_url('admin.php'),self::slug,'edit',$post_id);
	}

	public static function update_post($id, $content, $title=NULL, $page=NULL, $elementChain=NULL) {
		// $post_content = implode( "\n", array_map( 'sanitize_text_field', explode( "\n", $content )));
		$post_content =$content;
		if ($title==NULL) $title = get_post($id)->post_title;
		$post_id = wp_update_post( array(
				'ID' 			=> (int) $id,
				'post_status' 	=> 'publish',
				'post_title'	=> $title,
				'post_content' 	=> $post_content //sanitize will strip line breaks

		));
		if ($page != null) update_post_meta($id, self::page_id, $page);
		if ($elementChain != null) update_post_meta($id, self::element_chain, $elementChain);
		return self::get_tooltip($post_id);
	}

	public static function get_title($post) { //post or ID
		$post = get_post($post);
		$title = $post->post_title;
		if ($title == __(self::default_title, "responsive-sticky-notes")) {
			$title.=  self::get_tooltip($post) ;
		}
		return $title;
	}

	public static function get_tooltip($post) { //post or ID
		$post = get_post($post);
		$title = $post->post_title;
		if ($title == __(self::default_title, "responsive-sticky-notes")) {

			if (preg_match('/^\s*([^\s]+\s*){1,40}/',$post->post_content, $matches) == 1) { //any 3 character strings which don't have a space in them, i.e. words with any character
				$title = trim($matches[0]) . '..........';
			}
			else $title=__(self::default_tooltip, "responsive-sticky-notes");
		}
		return esc_html($title);
	}

	public static function get_next_ID() {
		$args = array(
				'post_type'		=>	self::post_type,
				'post_status' 	=> 'draft',
				'author__in'  =>[get_current_user_id()],
		);
		$my_query = new WP_Query( $args );
		if( $my_query->have_posts() ) {
			while( $my_query->have_posts() ) {
				$my_query->the_post();
				$ret = get_the_ID();
				wp_reset_postdata();
				return $ret;
			}
		}
		//not found
		$post_id = wp_insert_post( array(
				'post_type' => self::post_type,
				'post_status' => 'draft',
				'post_title' => __(self::default_title, "responsive-sticky-notes"),
				'post_author'=>get_current_user_id(),
		));
		add_post_meta($post_id, RESPONSIVESTICKYNOTES_note::element_chain, '');
		add_post_meta($post_id, RESPONSIVESTICKYNOTES_note::page_id, 1);
		add_post_meta($post_id, RESPONSIVESTICKYNOTES_note::color, '');
		add_post_meta($post_id, RESPONSIVESTICKYNOTES_note::bgcolor, '');
		return $post_id;
	}

	public static function get_edit_page($post) {
		return sprintf('<a href="?page=%s&action=%s&id=%s">Edit</a>',$_REQUEST['page'],'edit',$post);
	}
	//Export CSV
	public static function export_csv($post_ids=NULL){
		global $post;
		$filename='Custom_Notes_'.date("d/m/Y").'.csv';
		if(isset($_POST['export_csv'])){
			header('Content-type: application/csv');
			header('Content-Disposition: attachment; filename='. $filename);
			header('Pragma: no-cache');
			header("Expires: 0");
			$args=array(
				'post_type' => self::post_type,
				'post_status' => 'publish',
				'author__in'  =>[get_current_user_id()],
				'posts_per_page' => -1,
			);
			$my_query = new WP_Query($args);
			if( $my_query->have_posts() ) {
				$file = fopen('php://output', 'w');
				while ($my_query->have_posts()) {
					$my_query->the_post();
					$elementChain = get_post_meta($post->ID, RESPONSIVESTICKYNOTES_note::element_chain, true);
					$found = true;
					if ($post_ids != NULL) {
						$found = false;
						$re = '/article#post-(\d+)/i';
						if (preg_match($re, $elementChain, $matches)) {
							if (in_array($matches[1], $post_ids)) {
								$found = true;
							}
						}
						if ($found==false) {
							$re = '/page-id-(\d+)/i';
							if (preg_match($re, $elementChain, $matches)) {
								if (in_array($matches[1], $post_ids)) {
									$found = true;
								}
							}
						}
					}
					if ($found) {
						$pageId = get_post_meta($post->ID, RESPONSIVESTICKYNOTES_note::page_id, true);
						$pageLink = get_permalink($pageId);
						$content = strip_tags($post->post_content);
						fputcsv($file,[$post->ID,$content,$pageLink]);
					}
				}
				wp_reset_query();
				fclose( $file );
			}
			exit();
		}
	}
	//obj is either an id or a post object
	private function __construct($obj) {
		//unused
		if (obj && self::post_type == get_post_type($post)) {
			$post = get_post($obj);
			$properties['name'] = $post->post_title;
			$properties['page'] = get_post_meta($post->ID, 'page');
			$properties['created'] = $post->post_date;
			$properties['updated'] = $post->post_modified;
			$properties['content'] = $post->post_content;
		}
	}
}